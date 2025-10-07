/*
Pig Latin
*/

function igpayAtinlay(str) {
  var input =
    typeof str === "string"
      ? str
      : document.getElementById("txtVal").value || "";
  var trimmed = input.trim();
  var words = trimmed === "" ? [] : trimmed.split(/\s+/);
  var result = [];

  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (word === "") {
      continue;
    }

    var beginning = word.charAt(0);

    if (/[aeiouAEIOU]/.test(beginning)) {
      result.push(word + "way");
      continue;
    }

    var ii = 1;
    for (; ii < word.length; ii++) {
      if (/[aeiouAEIOU]/.test(word.charAt(ii))) {
        break;
      }
      beginning += word.charAt(ii);
    }

    if (ii === word.length) {
      result.push(word + "ay");
    } else {
      result.push(word.slice(ii) + beginning + "ay");
    }
  }

  var output = result.join(" ");
  if (typeof str !== "string") {
    document.getElementById("pigLatLbl").innerHTML = output;
  }
  return output;
}

// Some examples of expected outputs
console.log(igpayAtinlay("pizza")); // "izzapay"
console.log(igpayAtinlay("apple")); // "appleway"
console.log(igpayAtinlay("happy meal")); // "appyhay ealmay"
