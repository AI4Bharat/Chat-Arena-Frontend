export default function IbmIcon({ className, ...props }) {
  return (
    <img 
      src="/ibm.png" 
      alt="IBM" 
      className={`object-contain scale-[2.5] ${className}`} 
      {...props} 
    />
  );
}
