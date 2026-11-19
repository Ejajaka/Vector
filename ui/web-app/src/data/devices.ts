/**
 * Device frames, mirroring the presets in Figma's Frame panel so a page can be
 * designed at the size it will actually ship at.
 */

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Portrait by default; the inspector can flip it. */
  orientation?: 'portrait' | 'landscape';
}

export interface DeviceGroup {
  id: string;
  label: string;
  devices: DevicePreset[];
}

export const DEVICE_GROUPS: DeviceGroup[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    devices: [
      { id: 'desktop', name: 'Desktop', width: 1440, height: 900 },
      { id: 'desktop-hd', name: 'Desktop HD', width: 1920, height: 1080 },
      { id: 'macbook-14', name: 'MacBook Pro 14"', width: 1512, height: 982 },
      { id: 'macbook-16', name: 'MacBook Pro 16"', width: 1728, height: 1117 },
    ],
  },
  {
    id: 'tablet',
    label: 'Tablet',
    devices: [
      { id: 'ipad-pro-13', name: 'iPad Pro 13"', width: 1032, height: 1376 },
      { id: 'ipad-pro-11', name: 'iPad Pro 11"', width: 834, height: 1194 },
      { id: 'ipad-mini', name: 'iPad mini', width: 744, height: 1133 },
      { id: 'surface-pro', name: 'Surface Pro', width: 912, height: 1368 },
    ],
  },
  {
    id: 'phone',
    label: 'Phone',
    devices: [
      { id: 'iphone-17', name: 'iPhone 17', width: 402, height: 874 },
      { id: 'iphone-16', name: 'iPhone 16', width: 393, height: 852 },
      { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', width: 440, height: 956 },
      { id: 'iphone-14', name: 'iPhone 13 & 14', width: 390, height: 844 },
      { id: 'android-compact', name: 'Android Compact', width: 412, height: 917 },
      { id: 'android-medium', name: 'Android Medium', width: 700, height: 840 },
      { id: 'pixel-9', name: 'Pixel 9', width: 412, height: 923 },
    ],
  },
  {
    id: 'watch',
    label: 'Watch',
    devices: [
      { id: 'watch-45', name: 'Apple Watch 45mm', width: 198, height: 242 },
      { id: 'watch-41', name: 'Apple Watch 41mm', width: 176, height: 215 },
    ],
  },
  {
    id: 'tv',
    label: 'TV & Display',
    devices: [
      { id: 'tv-fhd', name: 'TV 1080p', width: 1920, height: 1080 },
      { id: 'tv-4k', name: 'TV 4K', width: 3840, height: 2160 },
      { id: 'presentation', name: 'Presentation 16:9', width: 1920, height: 1080 },
    ],
  },
  {
    id: 'print',
    label: 'Print & Social',
    devices: [
      { id: 'a4', name: 'A4 Portrait', width: 794, height: 1123 },
      { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080 },
      { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920 },
      { id: 'og-image', name: 'Open Graph', width: 1200, height: 630 },
    ],
  },
];

export const ALL_DEVICES: DevicePreset[] = DEVICE_GROUPS.flatMap((group) => group.devices);

export function findDevice(id: string): DevicePreset | undefined {
  return ALL_DEVICES.find((device) => device.id === id);
}

/** Match a page size back to a preset name, for the inspector header. */
export function describeSize(width: number, height: number): string {
  const portrait = ALL_DEVICES.find((device) => device.width === width && device.height === height);
  if (portrait) return portrait.name;
  const landscape = ALL_DEVICES.find((device) => device.width === height && device.height === width);
  if (landscape) return `${landscape.name} · landscape`;
  return 'Custom';
}
