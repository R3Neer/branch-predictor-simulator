import { SvgIcon, type SvgIconProps } from "@mui/material";

export function BackIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M20 11H7.8l5.6-5.6L12 4 4 12l8 8 1.4-1.4L7.8 13H20v-2Z" />
    </SvgIcon>
  );
}

export function CalculateIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M5 3h14v2H5V3Zm2 5h2v2H7V8Zm4 0h2v2h-2V8Zm4 0h2v2h-2V8Zm-8 4h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v6h-2v-6Zm-8 4h6v2H7v-2Z" />
    </SvgIcon>
  );
}

export function CheckIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="m9 16.2-3.5-3.5L4 14.2 9 19 20 8l-1.5-1.5L9 16.2Z" />
    </SvgIcon>
  );
}

export function DownloadIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M11 4h2v8l3.3-3.3 1.4 1.4L12 15.8l-5.7-5.7 1.4-1.4L11 12V4Zm-5 14h12v2H6v-2Z" />
    </SvgIcon>
  );
}

export function PlayIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M8 5v14l11-7L8 5Z" />
    </SvgIcon>
  );
}

export function ResetIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 5a7 7 0 1 1-6.3 4H3l4-4 4 4H7.9A5 5 0 1 0 12 7V5Z" />
    </SvgIcon>
  );
}

export function RunAllIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M6 5v14l8-7-8-7Zm9 0h3v14h-3V5Z" />
    </SvgIcon>
  );
}
