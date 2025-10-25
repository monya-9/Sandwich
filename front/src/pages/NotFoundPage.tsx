import React from "react";
import { useNavigate } from "react-router-dom";
import { getStaticUrl } from "../config/staticBase";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full text-center">
        <div className="mb-8">
          <div className="mx-auto mb-6 w-full max-w-[1000px]">
            <img
              src={getStaticUrl("assets/images/404_error.png")}
              alt="404"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          죄송합니다.페이지를 찾을 수 없습니다.
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          존재하지 않는 주소를 입력하셨거나<br />
          요청하신 페이지의 주소가 변경, 삭제되어 찾을 수 없습니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoHome}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            홈으로
          </button>
        </div>
 
      </div>
    </div>
  );
};

export default NotFoundPage;
