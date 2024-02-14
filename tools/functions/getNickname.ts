interface getNicknameArgs {
  location: string;
}

export default function getNickname(args: getNicknameArgs) {
  // Add your business logic here
  console.log(args);
  return "LA";
}
