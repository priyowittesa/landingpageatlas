export type AuthUserDto = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone_number: string | null;
  profile_picture_url: string | null;
};

export type AuthLoginResponseDto = {
  access_token: string;
  refresh_token: string;
};

export type AuthRegisterFormDto = {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
};
