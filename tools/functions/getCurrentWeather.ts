interface getCurrentWeatherArguments {
  location: string;
}

export default function getCurrentWeather(args: getCurrentWeatherArguments) {
  // Add your business logic here
  console.log(args);
  return "22C";
}
