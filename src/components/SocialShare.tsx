import { Button } from "@/components/ui/button";
import { Share2, Twitter, MessageCircle, Facebook, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SocialShareProps {
  title: string;
  prediction: string;
  confidence: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
}

export const SocialShare = ({
  title,
  prediction,
  confidence,
  homeTeam,
  awayTeam,
  league,
}: SocialShareProps) => {
  const shareText = `🔮 ${homeTeam} vs ${awayTeam}\n📊 Prediction: ${prediction} (${confidence}% confidence)\n🏆 ${league}\n\nGet AI predictions at PredictPro!`;
  const shareUrl = "https://predictpro.guru";

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleTwitterShare} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2 text-[#1DA1F2]" />
          Twitter/X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2 text-[#4267B2]" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTelegramShare} className="cursor-pointer">
          <Send className="h-4 w-4 mr-2 text-[#0088cc]" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Share2 className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
