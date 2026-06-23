/**
 * Payload of `POST /teams/:slug/pipelines/:pipelineId/stages` and
 * `PATCH /teams/:slug/pipelines/stages/:stageId`.
 */
export interface PipelineStageUpsertDto {
  name: string;
  key?: string;
  color?: string | null;
  isWon?: boolean;
  isLost?: boolean;
}

/**
 * Payload of `PATCH /teams/:slug/pipelines/stages/reorder`.
 */
export interface ReorderStagesDto {
  pipelineId: string;
  orderedIds: string[];
}
