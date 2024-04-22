import { useEffect, useState } from "react";
import { socket } from "../../../lib/socket";
import { useUser } from "../../../lib/contexts/UserContext";
import { Chat, Message, PublicChat } from "../../../lib/types/Chat";
import PublicChatTitle from "./PublicChatTitle";
import PublicChatMessageSendBox from "./PublicChatMessageSendBox";
import PublicChatMessagePane from "./PublicChatMessagePane";

const PublicChatPanel = ({ publicChatId }: { publicChatId: string }) => {
  // let { chatId } = useParams();

  const { currentUser, isLoading } = useUser();

  const [isFetching, setFetching] = useState<boolean>(true);
  const [isInvalid, setInvalid] = useState<boolean>(false);

  const [publicChatRoom, setPublicChatRoom] = useState<PublicChat>();
  const [messages, setMessages] = useState<Message[]>([]);

  async function initRoom() {
    if (!currentUser) return;
    setFetching(true);
    setInvalid(false);
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + "/chats/public/" + publicChatId,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();

        setPublicChatRoom(data);
        setMessages(data.messages);

        console.log(data);

        const readRes = await fetch(
          import.meta.env.VITE_BACKEND_URL + "/chats/public/" + publicChatId + "/read",
          {
            method: "PUT",
            credentials: "include",
          }
        );

        setFetching(false);
      } else {
        setInvalid(true);
        setFetching(false);
      }
    } catch (err) {
      setInvalid(true);
      setFetching(false);
    }
  }

  function addMessage(newMessage: Message) {
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
  }

  useEffect(() => {
    initRoom();
  }, [isLoading, publicChatId]);

  // useEffect(() => {
  //   console.log(id)
  // }, [id])

  // useEffect(() => {
  //   setMessages([])
  // }, [chatId])

  useEffect(() => {
    socket.on(`publicChats:${publicChatId}:addMessage`, (message) => addMessage(message));
    socket.on("updateData", () => {
      initRoom();
    });
    return function cleanup() {
      socket.off(`publicChats:${publicChatId}:addMessage`);
      socket.off("updateData");
    };
  }, [messages, publicChatId]);

  // useEffect(() => {
  //   console.log(messages)
  // }, [messages])

  if (!currentUser || !publicChatRoom || isInvalid) {
    return <></>;
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <PublicChatTitle publicChat={publicChatRoom} />
      <PublicChatMessagePane messages={messages} />
      <PublicChatMessageSendBox
        publicChat={publicChatRoom}
        publicChatId={publicChatId || ""}
      />
    </div>
  );
};

export default PublicChatPanel;
