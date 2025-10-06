/*
    Fibonacci Sequence - Enter a number and have the program
    generate the Fibonacci sequence to that number or to the Nth number.
*/
// This array will keep memory of the previous fibonacci numbers
var memo = {};
function fibonacci() {
  "use strict";
  var n = parseInt(document.getElementById("num").value);
  var val = f(n);
  document.getElementById("fibonacciLbl").innerText = val;
}

function f(n) {
  var value;
  // Check if the memory array already contains the requested number
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (n < 0) return undefined;
  if (memo.hasOwnProperty(n)) {
    value = memo[n];
  } else {
    value = f(n - 1) + f(n - 2);
    memo[n] = value;
  }

  return value;
}

document.getElementById("btn").addEventListener("click", fibonacci);
