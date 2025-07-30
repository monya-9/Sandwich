// components/Auth/Join/TermsAgreement.tsx
import React from "react";

interface Props {
    agreed: boolean;
    onToggle: () => void;
}

const TermsAgreement = ({ agreed, onToggle }: Props) => {
    return (
        <div className="my-6 text-left">
            <label className="flex items-start space-x-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={onToggle}
                    className="mt-1 accent-green-600"
                />
                <div>
                    <p className="font-medium text-black">
                        샌드위치 가입 약관에 모두 동의합니다.
                    </p>
                    <p className="text-sm text-gray-500">
                        샌드위치 이용약관(필수), 개인정보취급방침(필수),<br/>마케팅정보 수집동의(선택)
                    </p>
                </div>
            </label>
        </div>
    );
};

export default TermsAgreement;
