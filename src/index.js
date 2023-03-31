class NPCGenerator {
  static ID = "npc-generator";
  static HTMLID = "74b93f8";

  static log(force, ...args) {
    const shouldLog =
      force ||
      game.modules.get("_dev-mode")?.api?.getPackageDebugValue(this.ID);

    if (shouldLog) {
      console.log(this.ID, "|", ...args);
    }
  }
}

const notifyImportWarning = () => {
  ui.notifications?.warn(
    `You need to import qnpc roll tables in order for this to work.`,
    { permanent: false }
  );
};

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(NPCGenerator.ID);
});

const racialNameTables = new Map();
const physicalTraitTables = new Map();

const generateNpc = async () => {
  const raceTable = physicalTraitTables.get("qnpc Race");
  const humanSubRaceTable = physicalTraitTables.get("qnpc Human");
  const genderTable = physicalTraitTables.get("qnpc Gender");

  const [raceRoller, genderRoller] = await Promise.all([
    new Roll(raceTable.formula),
    new Roll(genderTable.formula),
  ]);

  const [raceRoll, genderRoll] = await Promise.all([
    raceRoller.roll({ async: true }),
    genderRoller.roll({ async: true }),
  ]);

  const [raceResults, genderResults] = await Promise.all([
    raceTable.getResultsForRoll(raceRoll.total),
    genderTable.getResultsForRoll(genderRoll.total),
  ]);

  const [raceResult] = raceResults;
  const [genderResult] = genderResults;

  let firstname = null;
  let lastname = null;
  let humanSubRace = null;

  if (raceResult.text === "Human") {
    const humanSubRaceRoller = await new Roll(humanSubRaceTable.formula);
    const humanSubRaceRoll = await humanSubRaceRoller.roll({ async: true });
    const [humanSubRaceResult] = await humanSubRaceTable.getResultsForRoll(
      humanSubRaceRoll.total
    );
    humanSubRace = humanSubRaceResult.text;

    const nameTable = racialNameTables.get(
      `qnpc ${raceResult.text} ${genderResult.text} ${humanSubRaceResult.text}`
    );
    const nameRoller = await new Roll(nameTable.formula);
    const nameRoll = await nameRoller.roll({ async: true });
    const [nameResult] = await nameTable.getResultsForRoll(nameRoll.total);

    firstname = nameResult.text;
  } else {
    const firstNameTable = racialNameTables.get(
      `qnpc ${raceResult.text} ${genderResult.text}`
    );
    const lastNameTable = racialNameTables.get(
      `qnpc ${raceResult.text} Lastname`
    );

    const firstNameRoller = await new Roll(firstNameTable.formula);
    const firstNameRoll = await firstNameRoller.roll({ async: true });
    const [firstNameResult] = firstNameTable.getResultsForRoll(
      firstNameRoll.total
    );

    firstname = firstNameResult.text;

    if (lastNameTable) {
      const lastNameRoller = await new Roll(lastNameTable.formula);
      const lastNameRoll = await lastNameRoller.roll({ async: true });
      const [lastNameResult] = lastNameTable.getResultsForRoll(
        lastNameRoll.total
      );
      lastname = lastNameResult.text;
    }
  }

  const bodyTable = physicalTraitTables.get("qnpc Body");
  const chinJawTable = physicalTraitTables.get("qnpc Chin or jaw");
  const earsTable = physicalTraitTables.get("qnpc Ears");
  const eyesTable = physicalTraitTables.get("qnpc Eyes");
  const hairTable = physicalTraitTables.get("qnpc Hair");
  const heightTable = physicalTraitTables.get("qnpc Height");
  const mouthTable = physicalTraitTables.get("qnpc Mouth");
  const otherTable = physicalTraitTables.get("qnpc Other");

  const [
    bodyRoller,
    chinRoller,
    earsRoller,
    eyesRoller,
    hairRoller,
    heightRoller,
    mouthRoller,
    otherRoller,
  ] = await Promise.all([
    new Roll(bodyTable.formula),
    new Roll(chinJawTable.formula),
    new Roll(earsTable.formula),
    new Roll(eyesTable.formula),
    new Roll(hairTable.formula),
    new Roll(heightTable.formula),
    new Roll(mouthTable.formula),
    new Roll(otherTable.formula),
  ]);

  const [
    bodyRoll,
    chinRoll,
    earsRoll,
    eyesRoll,
    hairRoll,
    heightRoll,
    mouthRoll,
    otherRoll,
  ] = await Promise.all([
    bodyRoller.roll({ async: true }),
    chinRoller.roll({ async: true }),
    earsRoller.roll({ async: true }),
    eyesRoller.roll({ async: true }),
    hairRoller.roll({ async: true }),
    heightRoller.roll({ async: true }),
    mouthRoller.roll({ async: true }),
    otherRoller.roll({ async: true }),
  ]);

  const [body] = bodyTable.getResultsForRoll(bodyRoll.total);
  const [chin] = chinJawTable.getResultsForRoll(chinRoll.total);
  const [ears] = earsTable.getResultsForRoll(earsRoll.total);
  const [eyes] = eyesTable.getResultsForRoll(eyesRoll.total);
  const [hair] = hairTable.getResultsForRoll(hairRoll.total);
  const [height] = heightTable.getResultsForRoll(heightRoll.total);
  const [mouth] = mouthTable.getResultsForRoll(mouthRoll.total);
  const [other] = otherTable.getResultsForRoll(otherRoll.total);

  const pronoun = genderResult.text === "Female" ? "She" : "He";
  const possessiveAdjective = genderResult.text === "Female" ? "Her" : "His";

  // TODO: Save result to jurnal optional
  // <br><br>
  // <button>Save to Jurnal</button>
  ChatMessage.create({
    user: game.user._id,
    content: `
    <strong>QNPC Generator:</strong> <br><br>
    This NPC is a ${raceResult.text}${
      humanSubRace ? ` (${humanSubRace})` : ""
    } and ${possessiveAdjective.toLowerCase()} name is ${firstname}${
      lastname ? ` ${lastname}.` : "."
    } ${pronoun} has ${hair.text
      .split(".")[0]
      .toLowerCase()} and has ${eyes.text.toLowerCase()}.
    ${pronoun} also has ${mouth.text
      .split(".")[0]
      .toLowerCase()} and ${ears.text.toLowerCase()}
    ${pronoun} is ${height.text
      .split(".")[0]
      .toLowerCase()} and ${body.text.toLowerCase()}
    ${possessiveAdjective} face has ${other.text
      .split(".")[0]
      .toLowerCase()} and ${chin.text.toLowerCase()}

    `,
    whisper: ChatMessage.getWhisperRecipients("GM"),
  });
};

Hooks.on("renderSidebarTab", async (app, html) => {
  if (app.tabName === "tables" && game.user.isGM) {
    const header = html.find(`.directory-header`);
    const actions = header.find(`.header-actions`);
    actions.append(
      `<button class="${NPCGenerator.HTMLID}-generate-npc">Roll for a new NPC</button>`
    );

    html.on("click", `.${NPCGenerator.HTMLID}-generate-npc`, async (event) => {
      NPCGenerator.log(true, "Generating Random NPC!");

      if (game.tables.contents.length === 0) {
        return notifyImportWarning();
      }

      game.tables.forEach((value) => {
        if (value.name.startsWith("qnpc")) {
          if (
            value.name.includes("Female") ||
            value.name.includes("Male") ||
            value.name.includes("Lastname")
          ) {
            racialNameTables.set(value.name, value);
          } else {
            physicalTraitTables.set(value.name, value);
          }
        }
      });

      if (racialNameTables.size === 0 || physicalTraitTables.size === 0) {
        return notifyImportWarning();
      }

      await generateNpc();
      NPCGenerator.log(true, { racialNameTables, physicalTraitTables });
    });
  }
});
