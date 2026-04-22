import axiosInstance from './axiosInstance'

export const dealPipelinesAPI = {
  getAllPipelines: (params) => axiosInstance.get('/deal-pipelines', { params }),
  createPipeline: (data) => axiosInstance.post('/deal-pipelines', data),
  updatePipeline: (id, data) => axiosInstance.put(`/deal-pipelines/${id}`, data),
  deletePipeline: (id) => axiosInstance.delete(`/deal-pipelines/${id}`),
  getStages: (pipelineId, params) => axiosInstance.get(`/deal-pipelines/${pipelineId}/stages`, { params }),
  createStage: (pipelineId, data) => axiosInstance.post(`/deal-pipelines/${pipelineId}/stages`, data),
  updateStage: (pipelineId, stageId, data) => axiosInstance.put(`/deal-pipelines/${pipelineId}/stages/${stageId}`, data),
  deleteStage: (pipelineId, stageId) => axiosInstance.delete(`/deal-pipelines/${pipelineId}/stages/${stageId}`),
  reorderStages: (pipelineId, data) => axiosInstance.patch(`/deal-pipelines/${pipelineId}/stages/reorder`, data),
}
