import { DriveDataFile } from "../types";

const FILENAME = "dealscout_data_v1.json";
const MIME_TYPE = "application/json";

// We use the 'drive.file' scope so we only access files created by this app
// This is safer and requires less permission review than full Drive access.

export const googleDriveService = {
  /**
   * Search for our specific data file in the user's Drive
   */
  findFile: async (accessToken: string): Promise<string | null> => {
    const q = encodeURIComponent(`name = '${FILENAME}' and trashed = false`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id, name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let msg = `Failed to search Drive: ${response.status} ${errorText}`;
      if (response.status === 403 && errorText.includes('Drive API has not been used')) {
        msg = `Google Drive API is not enabled. Please enable it in your Google Cloud Console.`;
      } else if (response.status === 403 && errorText.includes('insufficientPermissions')) {
        msg = `Insufficient permissions. Please log in again and make sure to check the box to grant Google Drive access.`;
      }
      throw new Error(msg);
    }
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  },

  /**
   * Create the initial file if it doesn't exist
   */
  createFile: async (accessToken: string, initialData: DriveDataFile): Promise<string> => {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: FILENAME,
      mimeType: MIME_TYPE,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(initialData) +
      close_delim;

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let msg = `Failed to create file on Drive: ${response.status} ${errorText}`;
      if (response.status === 403 && errorText.includes('Drive API has not been used')) {
        msg = `Google Drive API is not enabled. Please enable it in your Google Cloud Console.`;
      }
      throw new Error(msg);
    }
    const data = await response.json();
    return data.id;
  },

  /**
   * Update the existing file content
   */
  updateFile: async (accessToken: string, fileId: string, data: DriveDataFile): Promise<void> => {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      mimeType: MIME_TYPE,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(data) +
      close_delim;

    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save to Drive: ${response.status} ${response.statusText} - ${errorText}`);
    }
  },

  /**
   * Read the content of the file
   */
  readFile: async (accessToken: string, fileId: string): Promise<DriveDataFile> => {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let msg = `Failed to read file from Drive: ${response.status} ${errorText}`;
      if (response.status === 403 && errorText.includes('Drive API has not been used')) {
        msg = `Google Drive API is not enabled. Please enable it in your Google Cloud Console.`;
      }
      throw new Error(msg);
    }
    return await response.json();
  },

  /**
   * Upload a specific document (PDF/Image) to Drive separately.
   * Use this for CIMs and PnLs to avoid 5MB LocalStorage limits.
   */
  uploadDealDocument: async (accessToken: string, file: File, dealName: string): Promise<{ id: string, webViewLink: string }> => {
     const metadata = {
        name: `[DealScout] ${dealName} - ${file.name}`,
        mimeType: file.type,
     };

     const form = new FormData();
     form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
     form.append("file", file);

     const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", 
        {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form
        }
     );

     if (!response.ok) {
       const errorText = await response.text();
       let msg = `Failed to upload document to Drive: ${response.status} ${errorText}`;
       if (response.status === 403 && errorText.includes('Drive API has not been used')) {
         msg = `Google Drive API is not enabled. Please enable it in your Google Cloud Console.`;
       }
       throw new Error(msg);
     }
     return await response.json();
  }
};