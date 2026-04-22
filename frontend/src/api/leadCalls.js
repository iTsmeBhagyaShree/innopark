import axiosInstance from './axiosInstance';

// ================================================
// LEAD CALLS API
// ================================================

export const leadCallsAPI = {
  // Get all calls for a lead
  getCallsByLeadId: (leadId, companyId) => {
    return axiosInstance.get(`/leads/${leadId}/calls`, {
      params: { company_id: companyId }
    });
  },

  // Create a new call log
  createCall: (leadId, companyId, callData) => {
    return axiosInstance.post(`/leads/${leadId}/calls`, callData, {
      params: { company_id: companyId }
    });
  },

  // Update a call log
  updateCall: (leadId, callId, companyId, callData) => {
    return axiosInstance.put(`/leads/${leadId}/calls/${callId}`, callData, {
      params: { company_id: companyId }
    });
  },

  // Delete a call log
  deleteCall: (leadId, callId, companyId) => {
    return axiosInstance.delete(`/leads/${leadId}/calls/${callId}`, {
      params: { company_id: companyId }
    });
  }
};





