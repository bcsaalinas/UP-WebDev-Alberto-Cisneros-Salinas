import sw from "star-wars-quotes";
import superheroes, { randomSuperhero } from "superheroes";
import supervillains, { randomSupervillain } from "supervillains";
import { readFile } from "fs";

console.log("Hello, World!");
console.log(sw());

const hero = randomSuperhero();
const villain = randomSupervillain();

readFile("./data/input.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  console.log(`${hero} vs ${villain}`);
  console.log("Your secret message: ", data);
});
