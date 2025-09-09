-- Create admin settings table for API keys
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only allow all operations (no user restriction for admin settings)
CREATE POLICY "Allow all operations on admin_settings" ON public.admin_settings FOR ALL USING (true);

-- Insert default API key placeholders
INSERT INTO public.admin_settings (key, value) VALUES 
('lygos_api_key', 'your_lygos_api_key_here'),
('mycoolpay_api_key', 'your_mycoolpay_api_key_here');

-- Create trigger for updating updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();