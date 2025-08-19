import { fetcher } from '@/lib/api';

interface Album {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  // Add other fields as needed
}

interface Image {
  id: string;
  album_id: string;
  public_url: string;
  // Add other fields as needed
}

export const api = {
  // Album endpoints
  getAlbum: (albumId: string) => 
    fetcher<Album>(`/api/albums/${albumId}`),
  
  getAlbumImages: (albumId: string) => 
    fetcher<Image[]>(`/api/albums/${albumId}/images`),
  
  // Image endpoints
  getImage: (imageId: string) => 
    fetcher<Image>(`/api/images/${imageId}`),
  
  // Upload endpoint
  uploadImage: async (file: File, albumId: string, userId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('albumId', albumId);
    formData.append('userId', userId);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.onrender.com';
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = new Error('Upload failed');
      const data = await response.json();
      (error as any).status = response.status;
      (error as any).info = data;
      throw error;
    }

    return response.json();
  },

  // Email verification
  checkEmail: (email: string) => 
    fetcher<{ exists: boolean }>('/api/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
