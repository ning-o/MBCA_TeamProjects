import { useState } from 'react';
import { Button } from '../../common/components/button';
import { Input } from '../../common/components/input';
import { Label } from '../../common/components/label';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

export function SignUpScreen() {
  const handleSubscription = () => navigation.navigate('SubsRouter');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [idCheckResult, setIdCheckResult] = useState(null);

  const handleCheckId = async () => {
    if (!userId) return;
    
    setIsCheckingId(true);
    // 실제로는 서버에 확인 요청
    await new Promise(resolve => setTimeout(resolve, 500));
    setIdCheckResult(Math.random() > 0.5 ? 'available' : 'taken');
    setIsCheckingId(false);
  };

  const handleKakaoSignup = () => {
    // 카카오 로그인 처리
    console.log('카카오 회원가입');
  };

  const handleNaverSignup = () => {
    // 네이버 로그인 처리
    console.log('네이버 회원가입');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (idCheckResult !== 'available') {
      alert('아이디 중복 확인을 해주세요.');
      return;
    }
    console.log('회원가입:', { userId, password, email });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-[#FFF5F7] rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-[#8B6F9C]">회원가입</h1>
        <p className="text-center text-[#A98BB5] mb-8">환영합니다! 회원 정보를 입력해주세요</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 아이디 입력 */}
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-[#8B6F9C]">아이디</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setIdCheckResult(null);
                  }}
                  placeholder="아이디를 입력하세요"
                  className="bg-white border-[#E5D4ED] focus:border-[#B8A3C9] pr-10"
                />
                {idCheckResult && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {idCheckResult === 'available' ? (
                      <CheckCircle2 className="w-5 h-5 text-[#A8D5BA]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#F5A3A3]" />
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={handleCheckId}
                disabled={isCheckingId || !userId}
                className="bg-[#B8A3C9] hover:bg-[#A890B8] text-white px-4 whitespace-nowrap"
              >
                {isCheckingId ? '확인중...' : '중복 확인'}
              </Button>
            </div>
            {idCheckResult && (
              <p className={`text-sm ${idCheckResult === 'available' ? 'text-[#7BC4A4]' : 'text-[#F5A3A3]'}`}>
                {idCheckResult === 'available' ? '사용 가능한 아이디입니다.' : '이미 사용중인 아이디입니다.'}
              </p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#8B6F9C]">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="bg-white border-[#E5D4ED] focus:border-[#B8A3C9] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8A3C9] hover:text-[#A890B8]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#8B6F9C]">비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="bg-white border-[#E5D4ED] focus:border-[#B8A3C9] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8A3C9] hover:text-[#A890B8]"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-[#F5A3A3]">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#8B6F9C]">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="bg-white border-[#E5D4ED] focus:border-[#B8A3C9]"
            />
          </div>

          {/* 회원가입 버튼 */}
          <Button
            type="submit"
            className="w-full bg-[#B8A3C9] hover:bg-[#A890B8] text-white h-12 text-base font-semibold"
          >
            회원가입
          </Button>
        </form>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5D4ED]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#FFF5F7] text-[#A98BB5]">또는</span>
          </div>
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleKakaoSignup}
            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] h-12 font-semibold"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.7-.6 2.1-.7 2.5 0 .1-.1.3 0 .4.1.1.2.1.3.1.3-.1 2.4-1.6 2.8-1.9.6.1 1.2.2 1.8.2 5.5 0 10-3.6 10-8S17.5 3 12 3z"/>
            </svg>
            카카오로 가입하기
          </Button>

          <Button
            type="button"
            onClick={handleNaverSignup}
            className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white h-12 font-semibold"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
            </svg>
            네이버로 가입하기
          </Button>
        </div>

        {/* 로그인 링크 */}
        <p className="text-center mt-6 text-[#A98BB5]">
          이미 계정이 있으신가요?{' '}
          <button className="text-[#8B6F9C] font-semibold hover:underline">
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignUpScreen;
