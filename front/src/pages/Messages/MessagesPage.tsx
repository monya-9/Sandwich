import React, { useState } from 'react';
import { dummyMessages } from '../../data/dummyMessages';
import MessageList from '../../components/common/Message/MessageList';
import MessageDetail from '../../components/common/Message/MessageDetail';

const MessagesPage: React.FC = () => {
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

    const selectedMessage = dummyMessages.find((msg) => msg.id === selectedId);

    return (
        <div className="max-w-6xl mx-auto bg-white rounded-lg border overflow-hidden flex h-[600px]">
            <MessageList
                messages={dummyMessages}
                selectedId={selectedId}
                onSelect={setSelectedId}
            />
            <MessageDetail message={selectedMessage} />
        </div>
    );
};

export default MessagesPage;
