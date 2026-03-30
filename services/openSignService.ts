export interface OpenSignSigner {
  name: string;
  email: string;
}

export interface OpenSignRequest {
  file: File;
  title: string;
  signers: OpenSignSigner[];
}

export const openSignService = {
  /**
   * Mocks the integration with OpenSign API.
   * In a real implementation, this would send a POST request to the OpenSign API endpoint
   * (e.g., https://api.opensignlabs.com/v1/documents) with the file and signer details.
   */
  async sendDocumentForSignature(request: OpenSignRequest): Promise<{ success: boolean; message: string; documentId?: string }> {
    console.log('Initiating OpenSign document signature request...', request);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if API key is configured (mock check)
    const apiKey = import.meta.env.VITE_OPENSIGN_API_KEY;
    if (!apiKey) {
      console.warn('VITE_OPENSIGN_API_KEY is not set. Using mock implementation.');
    }

    try {
      // In a real scenario, you would use FormData to upload the file and JSON for signers
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('title', request.title);
      formData.append('signers', JSON.stringify(request.signers));
      
      const response = await fetch('https://api.opensignlabs.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to send document via OpenSign');
      }
      
      const data = await response.json();
      return { success: true, message: 'Document sent successfully', documentId: data.id };
    } catch (error) {
      console.error('OpenSign API Error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred while sending the document.' 
      };
    }
  }
};
