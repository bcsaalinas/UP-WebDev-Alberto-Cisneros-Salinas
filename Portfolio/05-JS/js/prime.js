/*
    Prime Factorization - Have the user enter a number and find
    all Prime Factors (if there are any) and display them.
*/

var getPrimeFactors = function () {
  "use strict";
  var n = parseInt(document.getElementById("num").value);
  var output = document.getElementById("pf");

  var i;
  var sequence = [];

  while (n % 2 === 0) {
    sequence.push(2);
    n = n / 2;
  }

  for (i = 3; i <= Math.sqrt(n); i += 2) {
    while (n % i === 0) {
      sequence.push(i);
      n = n / i;
    }
  }

  if (n > 2) {
    sequence.push(n);
  }

  output.innerHTML = sequence.join(", ");
};
