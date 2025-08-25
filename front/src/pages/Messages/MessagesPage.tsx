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
        <main className="mx-auto max-w-6xl px-4 mt-3">
            {/* 고정 높이 컨테이너: 내부 스크롤을 위해 min-h-0 */}
            <section className="bg-white rounded-lg border overflow-hidden flex h-[600px] min-h-0">
                <MessageList
                    messages={dummyMessages}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                />
                <MessageDetail
                    message={selectedMessage}
                    onSend={async (_id, _body) => {
                        // 이곳에 실제 API 연동
                        // await api.messages.reply(_id, _body)
                    }}
                    onMarkRead={(mid) => {
                        // 이곳에 읽음 처리 API 연동(optional)
                        // await api.messages.markRead(mid)
                    }}
                />
            </section>
        </main>
    );
};

export default MessagesPage;
