-- Create enum for game result types
CREATE TYPE public.game_result_type AS ENUM ('win', 'loss', 'jackpot');

-- Create table for economic configuration
CREATE TABLE public.economic_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_share_percentage DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  platform_share_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  jackpot_share_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  base_return_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0100,
  max_win_multiplier DECIMAL(8,2) NOT NULL DEFAULT 15.00,
  jackpot_trigger_rate DECIMAL(8,6) NOT NULL DEFAULT 0.001000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pre-generated game batches
CREATE TABLE public.game_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name VARCHAR(255) NOT NULL,
  total_games INTEGER NOT NULL,
  total_investment DECIMAL(15,2) NOT NULL,
  player_payout_target DECIMAL(15,2) NOT NULL,
  platform_revenue_target DECIMAL(15,2) NOT NULL,
  jackpot_contribution_target DECIMAL(15,2) NOT NULL,
  games_played INTEGER NOT NULL DEFAULT 0,
  actual_player_payout DECIMAL(15,2) NOT NULL DEFAULT 0,
  actual_platform_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  actual_jackpot_contribution DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pre-generated individual games
CREATE TABLE public.pre_generated_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.game_batches(id) ON DELETE CASCADE,
  game_index INTEGER NOT NULL,
  bet_amount DECIMAL(10,2) NOT NULL,
  max_achievable_score INTEGER NOT NULL,
  result_type public.game_result_type NOT NULL,
  win_multiplier DECIMAL(8,2),
  expected_payout DECIMAL(10,2) NOT NULL,
  skill_requirement INTEGER NOT NULL DEFAULT 1, -- 1 (easy) to 10 (expert)
  is_played BOOLEAN NOT NULL DEFAULT false,
  played_at TIMESTAMP WITH TIME ZONE,
  actual_score INTEGER,
  actual_payout DECIMAL(10,2)
);

-- Create table for jackpot management
CREATE TABLE public.jackpot_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_winner_id UUID,
  last_win_amount DECIMAL(15,2),
  last_win_date TIMESTAMP WITH TIME ZONE,
  total_contributions DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_payouts DECIMAL(15,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_game_batches_active ON public.game_batches(is_active);
CREATE INDEX idx_pre_generated_games_batch ON public.pre_generated_games(batch_id);
CREATE INDEX idx_pre_generated_games_played ON public.pre_generated_games(is_played);
CREATE INDEX idx_pre_generated_games_skill ON public.pre_generated_games(skill_requirement);

-- Enable Row Level Security
ALTER TABLE public.economic_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_generated_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jackpot_pool ENABLE ROW LEVEL SECURITY;

-- Create policies (currently open for development - should be restricted in production)
CREATE POLICY "Allow all operations on economic_config" ON public.economic_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_batches" ON public.game_batches FOR ALL USING (true);
CREATE POLICY "Allow all operations on pre_generated_games" ON public.pre_generated_games FOR ALL USING (true);
CREATE POLICY "Allow all operations on jackpot_pool" ON public.jackpot_pool FOR ALL USING (true);

-- Insert default economic configuration
INSERT INTO public.economic_config (
  player_share_percentage,
  platform_share_percentage,
  jackpot_share_percentage,
  base_return_rate,
  max_win_multiplier,
  jackpot_trigger_rate
) VALUES (70.00, 20.00, 10.00, 0.0100, 15.00, 0.001000);

-- Insert initial jackpot pool
INSERT INTO public.jackpot_pool (current_amount) VALUES (0);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_economic_config_updated_at
BEFORE UPDATE ON public.economic_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jackpot_pool_updated_at
BEFORE UPDATE ON public.jackpot_pool
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();