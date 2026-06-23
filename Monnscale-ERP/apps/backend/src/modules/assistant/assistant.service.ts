import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { CrmEntity, type AssistantMessage, type AssistantReply } from '@Moonscale/shared';
import { AssistantToolsService } from './assistant-tools.service';

/**
 * Port of App\Infrastructure\Assistant\CrmAssistant — drives a tool-calling
 * loop with Anthropic Claude. Tool definitions mirror SearchRecordsTool,
 * GetRecordTool and AggregateRecordsTool from the Laravel project.
 */
@Injectable()
export class AssistantService {
  constructor(
    private readonly config: ConfigService,
    private readonly tools: AssistantToolsService,
  ) {}

  async ask(history: AssistantMessage[], teamId: string, teamName: string, userName: string): Promise<AssistantReply> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "L'assistant IA n'est pas encore configuré. Ajoutez une clé ANTHROPIC_API_KEY pour l'activer.",
      );
    }
    const model = this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-opus-4-7';
    const client = new Anthropic({ apiKey });

    const systemPrompt = this.buildSystemPrompt(userName, teamName);
    const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

    let response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOL_SCHEMAS,
      messages,
    });

    // Tool-calling loop: keep handing tool_result back to Claude until it
    // produces a final text response.
    while (response.stop_reason === 'tool_use') {
      const toolUses = response.content.filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use');
      const results: Anthropic.MessageParam = {
        role: 'user',
        content: await Promise.all(
          toolUses.map(async (tu) => ({
            type: 'tool_result' as const,
            tool_use_id: tu.id,
            content: JSON.stringify(await this.runTool(teamId, tu.name, tu.input as Record<string, unknown>)),
          })),
        ),
      };
      //Anthropic.ContentBlockParam[]
      messages.push({ role: 'assistant', content: response.content as any });
      messages.push(results);

      response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOL_SCHEMAS,
        messages,
      });
    }

    const reply = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    return { reply, trace: this.tools.takeTrace() };
  }

  private async runTool(teamId: string, name: string, input: Record<string, unknown>): Promise<unknown> {
    if (name === 'search_records') {
      return this.tools.searchRecords(
        teamId,
        input.entity as CrmEntity,
        (input.filters as Record<string, unknown>) ?? {},
        Number(input.limit ?? 20),
      );
    }
    if (name === 'get_record') {
      return this.tools.getRecord(teamId, input.entity as CrmEntity, String(input.id));
    }
    if (name === 'aggregate_records') {
      return this.tools.aggregateRecords(
        teamId,
        input.entity as CrmEntity,
        input.op as 'count' | 'sum',
        input.field as string | undefined,
        (input.filters as Record<string, unknown>) ?? {},
      );
    }
    return { error: `Unknown tool: ${name}` };
  }

  private buildSystemPrompt(userName: string, teamName: string): string {
    const today = new Date().toLocaleDateString('fr-FR');
    return `Tu es l'assistant IA intégré au CRM Moonscale ERP. Tu aides l'utilisateur **${userName}** de l'équipe **${teamName}** à exploiter les données de son CRM.

Nous sommes le ${today} (format jj/mm/aaaa).

## Règles
- Réponds toujours en français, de façon claire et concise.
- Fonde TES RÉPONSES UNIQUEMENT sur les données obtenues via les outils. N'invente jamais d'enregistrement, de chiffre ou de champ.
- Prends en compte les champs personnalisés : tu peux les utiliser pour filtrer/regrouper et les citer dans tes réponses.
- Pour filtrer, passe l'argument \`filters\` sous forme d'objet JSON.
- Appelle plusieurs outils si nécessaire avant de répondre. Pour une question chiffrée (totaux, comptes), privilégie \`aggregate_records\`.
- Toutes les données sont déjà limitées à l'équipe de l'utilisateur ; ne mentionne pas d'autres équipes.`;
  }
}

const TOOL_SCHEMAS: Anthropic.Tool[] = [
  {
    name: 'search_records',
    description: 'Search CRM records of a given entity (company, contact, deal). Returns up to `limit` matching records, filtered by scalar columns or custom fields.',
    input_schema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['company', 'contact', 'deal'] },
        filters: { type: 'object', description: 'Plain JSON of field=value pairs. Unknown keys are interpreted as customFields.' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
      required: ['entity'],
    },
  },
  {
    name: 'get_record',
    description: 'Fetch one full record by id.',
    input_schema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['company', 'contact', 'deal'] },
        id: { type: 'string' },
      },
      required: ['entity', 'id'],
    },
  },
  {
    name: 'aggregate_records',
    description: 'Count or sum records of an entity. Sum currently supports deals.amount only.',
    input_schema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['company', 'contact', 'deal'] },
        op: { type: 'string', enum: ['count', 'sum'] },
        field: { type: 'string' },
        filters: { type: 'object' },
      },
      required: ['entity', 'op'],
    },
  },
];
