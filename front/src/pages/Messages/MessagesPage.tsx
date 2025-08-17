// src/pages/Messages/MessagesPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyMessages } from "../../data/dummyMessages";
import MessageList from "../../components/common/Message/MessageList";
import MessageDetail from "../../components/common/Message/MessageDetail";

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const routeId = id ? Number(id) : undefined;

    const [selectedId, setSelectedId] = React.useState<number | undefined>(routeId);
    React.useEffect(() => setSelectedId(routeId), [routeId]);

    const handleSelect = (mid: number) => {
        setSelectedId(mid);
        navigate(`/messages/${mid}`);
    };

    const selectedMessage = dummyMessages.find((m) => m.id === selectedId);

    return (
        <main className="mx-auto max-w-6xl px-4">
            <section className="bg-white rounded-lg border overflow-hidden flex h-[600px]">
                <MessageList
                    messages={dummyMessages}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                />
                <MessageDetail message={selectedMessage} />
            </section>
        </main>
    );
};

export default MessagesPage;