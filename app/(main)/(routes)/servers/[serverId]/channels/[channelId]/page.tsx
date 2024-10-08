import { currentProfile } from "@/lib/current-profile";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChannelType } from "@prisma/client";
import { MediaRoom } from "@/components/media-room";

interface ChannelIdPage {
  params: {
    serverId: string;
    channelId: string;
  };
}

const ChannelIdPage = async ({ params }: ChannelIdPage) => {
  const profile = await currentProfile();

  if (!profile) {
    return auth().redirectToSignIn();
  }

  // Query the database to fetch the channel by its ID
  const channel = await db.channel.findUnique({
    where: {
      id: params?.channelId,
    },
  });

  // Query the database to check if the user is a member of the server
  const member = await db.member.findFirst({
    where: {
      serverId: params?.serverId,
      profileId: profile.id,
    },
  });

  // If the channel does not exist or the user is not a member, redirect to the homepage
  if (!channel || !member) {
    redirect("/");
  }
  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        name={channel.name}
        serverId={channel.serverId}
        type="channel"
      />

      {channel.type === ChannelType.TEXT && (
        <>
          <ChatMessages
            name={channel.name}
            member={member}
            chatId={channel.id}
            type="channel"
            apiUrl="/api/messages" // API endpoint to fetch messages
            socketUrl="/api/socket/messages" // WebSocket URL for real-time messaging
            socketQuery={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
            paramKey="channelId"
            paramValue={channel.id}
          />
          <ChatInput
            name={channel.name}
            type="channel"
            apiUrl="/api/socket/messages" // API endpoint for sending messages
            query={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
          />
        </>
      )}
      {channel.type === ChannelType.AUDIO && (
        <MediaRoom chatID={channel.id} audio={true} video={false} />
      )}

      {channel.type === ChannelType.VIDEO && (
        <MediaRoom chatID={channel.id} audio={false} video={true} />
      )}
    </div>
  );
};

export default ChannelIdPage;
