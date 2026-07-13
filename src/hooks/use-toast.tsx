// Shim for components that import use-toast — redirect to sonner
export { toast } from 'sonner';
export const useToast = () => ({ toast: (msg: string) => console.log(msg) });
