interface Window {
  __TAURI_IPC__?: (cmd: string, args?: unknown) => Promise<any>
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
} 