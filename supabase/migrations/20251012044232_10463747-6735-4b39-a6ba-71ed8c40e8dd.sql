-- Fix coins for existing users
UPDATE public.profiles 
SET coins = 100 
WHERE coins = 0;