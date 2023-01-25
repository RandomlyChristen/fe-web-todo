import { makenewcardinner, modifycardform } from "./templates.js";
//import { adddeletelogregister, modifylogregister } from "./sidemenu.js";
import { API_URL_Box, API_URL_Col, API_URL_Eve } from "./main.js";

function showregisterform(Collist) {
  const CardForm = Collist.getElementsByClassName("NewCard")[0];

  if (CardForm.style.display != "block") {
    CardForm.style.display = "block";
    CardForm.getElementsByClassName("TitleInput")[0].focus();
  } else {
    CardForm.style.display = "none";
  }
}

function cardheightadjust(InputArea) {
  const CardButton =
    InputArea.closest(".NewCard").getElementsByClassName("CardRegister")[0];

  CardButton.disabled = InputArea.value.trim().length <= 0;

  InputArea.style.height = "auto";
  InputArea.style.height = `${InputArea.scrollHeight}px`;
}

const CardForm = {
  makenewcard: function () {
    dd;
  },
  cardheightadjust: function () {},
};

function makenewcard(CardRegisterForm) {
  let NewCardForm = document.createElement("div");
  NewCardForm.classList = "ColumnCards";
  let NewCardIDNum = new Date().getTime();
  NewCardForm.id = `${
    CardRegisterForm.closest(".ColumnList").id
  }-${NewCardIDNum}`;
  let NewTitle = CardRegisterForm.getElementsByClassName("TitleInput")[0].value;
  let NewBody =
    CardRegisterForm.getElementsByClassName("CardInput")[0].value.trim();
  NewCardForm.innerHTML = makenewcardinner(NewTitle, NewBody, "web");

  CardRegisterForm.closest(".ColumnList")
    .getElementsByClassName("CardSection")[0]
    .prepend(NewCardForm);

  CardRegisterForm.getElementsByClassName("TitleInput")[0].value = "";
  CardRegisterForm.getElementsByClassName("CardInput")[0].value = "";
  cardheightadjust(CardRegisterForm.getElementsByClassName("CardInput")[0]);
  CardRegisterForm.getElementsByClassName("CardRegister")[0].disabled = true;
  CardRegisterForm.style.display = "none";
  CardRegisterForm.closest(".ColumnList").getElementsByClassName(
    "CardCount"
  )[0].innerHTML =
    CardRegisterForm.closest(".ColumnList").getElementsByClassName(
      "CardSection"
    )[0].children.length;
  const NewEvent = {
    id: new Date().getTime(),
    ColumnName: CardRegisterForm.closest(".ColumnList")
      .getElementsByClassName("ColumnTitle")[0]
      .innerText.split("\n")[0],
    CardTitle: NewTitle,
    EventType: "등록",
    EventTime: new Date().getTime(),
  };
  fetch(API_URL_Eve, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(NewEvent),
  })
    .then((resp) => resp.json())
    .catch((error) => console.error(error));

  // adddeletelogregister(
  //   events[events.length - 1].ColumnName,
  //   events[events.length - 1].CardTitle,
  //   events[events.length - 1].EventType,
  //   events[events.length - 1].EventTime
  // );

  const NewCardObj = {
    id: NewCardForm.id,
    Title: NewTitle,
    Body: NewBody,
    Author: "web",
  };
  let Lists = [];
  Array.from(
    CardRegisterForm.closest(".ColumnList").getElementsByClassName(
      "CardSection"
    )[0].children
  ).forEach((card) => Lists.push(card.id));
  fetch(API_URL_Box, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(NewCardObj),
  })
    .then((resp) => resp.json())
    .catch((error) => console.error(error));
  fetch(`${API_URL_Col}/${CardRegisterForm.closest(".ColumnList").id}`, {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ Lists }),
  })
    .then((resp) => resp.json())
    .catch((error) => console.error(error));
}

function modifycard(TargetCard) {
  let BeforeTitle = TargetCard.getElementsByClassName("CardTitle")[0].innerText;
  let BeforeBody = TargetCard.getElementsByClassName("CardBody")[0].innerText;

  TargetCard.className = "NewCard";
  TargetCard.innerHTML = modifycardform(BeforeTitle, BeforeBody);
  cardheightadjust(TargetCard.getElementsByClassName("CardInput")[0]);

  function cancelmodify() {
    TargetCard.innerHTML = makenewcardinner(BeforeTitle, BeforeBody, "web");
    TargetCard.style.height = "";
    TargetCard.className = "ColumnCards";
  }
  function confirmmodify() {
    let NewTitle = TargetCard.getElementsByClassName("TitleInput")[0].value;
    let NewBody =
      TargetCard.getElementsByClassName("CardInput")[0].value.trim();
    TargetCard.innerHTML = makenewcardinner(NewTitle, NewBody, "web");
    TargetCard.style.height = "";
    TargetCard.className = "ColumnCards";
    const NewEvent = {
      id: new Date().getTime(),
      FromTitle: BeforeTitle,
      ToTitle: NewTitle,
      EventType: "변경",
      EventTime: new Date().getTime(),
    };
    fetch(API_URL_Eve, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(NewEvent),
    })
      .then((resp) => resp.json())
      .catch((error) => console.error(error));

    // modifylogregister(
    //   events[events.length - 1].FromTitle,
    //   events[events.length - 1].ToTitle,
    //   events[events.length - 1].EventType,
    //   events[events.length - 1].EventTime
    // );

    const NewCardObj = {
      id: TargetCard.id,
      Title: NewTitle,
      Body: NewBody,
      Author: "web",
    };
    fetch(`${API_URL_Box}/${TargetCard.id}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(NewCardObj),
    })
      .then((resp) => resp.json())
      .catch((error) => console.error(error));
  }

  TargetCard.getElementsByClassName("ModifyCancel")[0].addEventListener(
    "click",
    cancelmodify
  );
  TargetCard.getElementsByClassName("ModifyConfirm")[0].addEventListener(
    "click",
    confirmmodify
  );
}

export { showregisterform, cardheightadjust, makenewcard, modifycard };