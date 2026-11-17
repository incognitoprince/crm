import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };
export function PinIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="#5C5852" strokeWidth="1.6" {...props}><circle cx="17.5" cy="6.5" r="3" fill="#C59B27" stroke="#5C5852" /><path d="M15.2 8.8L5 19" strokeLinecap="round" /></svg>;
}
export function SpoolIcon({ color = "#C59B27", className = "w-6 h-6", ...props }: IconProps & { color?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="#4A453E" strokeWidth="1.5" {...props}><rect x="6" y="3" width="12" height="2.5" rx="1" fill="#A68A64" /><rect x="6" y="18.5" width="12" height="2.5" rx="1" fill="#A68A64" /><rect x="7.5" y="5.5" width="9" height="13" fill={color} /><path d="M7.5 8.5H16.5M7.5 12H16.5M7.5 15.5H16.5" stroke="#4A453E" strokeOpacity=".4" /></svg>;
}
export function ShearsIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="#4A453E" strokeWidth="1.6" strokeLinecap="round" {...props}><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><path d="M8.2 8.2L20 18M8.2 15.8L20 6" /></svg>;
}
export function SeamRipperIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} stroke="#4A453E" strokeWidth="1.6" strokeLinecap="round" {...props}><path d="M4 20L11 13" strokeWidth="3.5" stroke="#8C7A6B" /><path d="M11 13L17 7C18.5 5.5 20.5 6 20 8L17.5 10.5" /><circle cx="16.5" cy="9.5" r="1" fill="#A83830" stroke="none" /></svg>;
}
export function WarningTagIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} {...props}><rect x="4" y="5" width="16" height="14" rx="2" fill="#E8DCC8" stroke="#A83830" strokeWidth="1.4" strokeDasharray="2 1.5" /><path d="M12 8.5V12.5" stroke="#A83830" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="15.5" r="1" fill="#A83830" /></svg>;
}
export function SkeinButtonIcon({ className = "w-7 h-6", ...props }: IconProps) {
  return <svg viewBox="0 0 28 24" fill="none" className={className} {...props}><ellipse cx="9" cy="12" rx="4.5" ry="7.5" transform="rotate(-15 9 12)" fill="#9E9589" stroke="#4A453E" strokeWidth="1.4" /><path d="M7 7L11 17M6 12H12" stroke="#4A453E" strokeWidth="1.2" /><circle cx="20" cy="12" r="5.5" fill="#D8CFC0" stroke="#4A453E" strokeWidth="1.4" /><circle cx="18.5" cy="10.5" r=".8" fill="#3E3A35" /><circle cx="21.5" cy="10.5" r=".8" fill="#3E3A35" /><circle cx="18.5" cy="13.5" r=".8" fill="#3E3A35" /><circle cx="21.5" cy="13.5" r=".8" fill="#3E3A35" /></svg>;
}
export function ButtonBadge({ color = "#D8CFC0", size = 14 }: { color?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill={color} stroke="#5C5852" strokeWidth="1.4" /><circle cx="10" cy="10" r="6" stroke="#5C5852" strokeOpacity=".35" strokeWidth="1" /><circle cx="8" cy="8" r="1" fill="#3E3A35" /><circle cx="12" cy="8" r="1" fill="#3E3A35" /><circle cx="8" cy="12" r="1" fill="#3E3A35" /><circle cx="12" cy="12" r="1" fill="#3E3A35" /></svg>;
}
