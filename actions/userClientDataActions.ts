'use server';

import { db } from '@/lib/db';
import { User } from '@prisma/client';

interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

// ==================================
// GET CLIENT DATA
// ==================================
export const getClientData = async (userId: string): Promise<ApiResponse<User>> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found.',
      };
    }

    return {
      success: true,
      message: 'Client data fetched successfully.',
      data: user,
    };
  } catch (error: any) {
    console.error('Error fetching client data:', error);

    return {
      success: false,
      message: 'Error fetching client data.',
    };
  }
};

// ==================================
// UPDATE CLIENT DATA
// ==================================
export const updateClientData = async (userId: string, updatedFields: Partial<{
  apiUrl: string;
  company: string;
  notificationNumber: string;
  lat: string;
  lng: string;
  openingPhrase: string;
  mapsUrl: string;
}>): Promise<ApiResponse<User>> => {
  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updatedFields,
    });

    return {
      success: true,
      message: 'Client data updated successfully.',
      data: updatedUser,
    };
  } catch (error: any) {
    console.error('Error updating client data:', error);

    return {
      success: false,
      message: 'Error updating client data.',
    };
  }
};
