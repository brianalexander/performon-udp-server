function Seconds(seconds) {
  if (!(this instanceof Seconds)) return new Seconds(seconds);

  this.asMilliseconds = () => {
    return seconds * 1000;
  };

  this.asMinutes = () => {
    return Math.floor(seconds / 60);
  };

  this.asHours = () => {
    return Math.floor(seconds / 3600);
  };
}

function Minutes(minutes) {
  if (!(this instanceof Minutes)) return new Minutes(minutes);

  this.asMilliseconds = () => {
    return minutes * 60 * 1000;
  };

  this.asSeconds = () => {
    return minutes * 60;
  };

  this.asHours = () => {
    return Math.floor(minutes / 60);
  };
}

module.exports = {
  Seconds,
  Minutes
};
