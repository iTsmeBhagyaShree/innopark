import axiosInstance from './axiosInstance'

export const leadPipelinesAPI = {
  getAllPipelines: (params) => axiosInstance.get('/lead-pipelines', { params }),
  createPipeline: (data) => axiosInstance.post('/lead-pipelines', data),
  updatePipeline: (id, data) => axiosInstance.put(`/lead-pipelines/${id}`, data),
  deletePipeline: (id) => axiosInstance.delete(`/lead-pipelines/${id}`),
  getStages: (pipelineId, params) => axiosInstance.get(`/lead-pipelines/${pipelineId}/stages`, { params }),
  createStage: (pipelineId, data) => axiosInstance.post(`/lead-pipelines/${pipelineId}/stages`, data),
  updateStage: (pipelineId, stageId, data) => axiosInstance.put(`/lead-pipelines/${pipelineId}/stages/${stageId}`, data),
  deleteStage: (pipelineId, stageId) => axiosInstance.delete(`/lead-pipelines/${pipelineId}/stages/${stageId}`),
  reorderStages: (pipelineId, data) => axiosInstance.patch(`/lead-pipelines/${pipelineId}/stages/reorder`, data),
}
