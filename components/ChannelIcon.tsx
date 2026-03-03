import React from "react";

export type ChannelType = "telegram" | "whatsapp" | "discord";

import WhatsappLogo from "@/app/assets/whatsapp.svg";
import TelegramLogo from "@/app/assets/telegram.svg";
import DiscordLogo from "@/app/assets/discord.svg";
import Image from "next/image";

interface ChannelIconProps {
  channel: ChannelType;
}

export function ChannelIcon({ channel }: ChannelIconProps) {
  switch (channel) {
    case "telegram":
      return (
        <Image src={TelegramLogo} alt="Telegram Logo" width={20} height={20} />
      );
    case "whatsapp":
      return (
        <Image src={WhatsappLogo} alt="WhatsApp Logo" width={20} height={20} />
      );
    case "discord":
      return (
        <Image src={DiscordLogo} alt="Discord Logo" width={20} height={20} />
      );
  }
}
