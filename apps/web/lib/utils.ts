import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert transformation matrix to Euler angles
export function getEulerAngles(matrix: number[]): { yaw: number; pitch: number; roll: number } {
    const [
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33
    ] = matrix;

    const sy = Math.sqrt(m00 * m00 + m10 * m10);

    const singular = sy < 1e-6;

    let x, y, z;

    if (!singular) {
        x = Math.atan2(m21, m22);
        y = Math.atan2(-m20, sy);
        z = Math.atan2(m10, m00);
    } else {
        x = Math.atan2(-m12, m11);
        y = Math.atan2(-m20, sy);
        z = 0;
    }

    // Convert radians to degrees
    const pitch = x * (180 / Math.PI);
    const yaw = y * (180 / Math.PI);
    const roll = z * (180 / Math.PI);
    
    return { yaw, pitch, roll };
}


