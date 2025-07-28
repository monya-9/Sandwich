import githubIcon from "../../../assets/icons/github.png";
import googleIcon from "../../../assets/icons/Google.png";

const SNSLogin = () => {
    return (
        <div className="mt-4">
            <p className="text-sm text-gray-600">SNS로 간편하게 로그인하기</p>
            <div className="flex justify-center gap-4 mt-5">
                <img src={githubIcon} alt="GitHub" className="w-8 h-8 cursor-pointer" />
                <img src={googleIcon} alt="Google" className="w-8 h-8 cursor-pointer" />
            </div>
        </div>
    );
};

export default SNSLogin;
