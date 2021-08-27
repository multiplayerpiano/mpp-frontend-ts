// performing translation

////////////////////////////////////////////////////////////////

import * as $ from "jquery";

export class Translation {
  language: string;
  strings: Record<string, Record<string, string>> = {
    "people are playing": {
      "pt": "pessoas estão jogando",
      "es": "personas están jugando",
      "ru": "человек играет",
      "fr": "personnes jouent",
      "ja": "人が遊んでいる",
      "de": "Leute spielen",
      "zh": "人在玩",
      "nl": "mensen spelen",
      "pl": "osób grają",
      "hu": "ember játszik"
    },
    "New Room...": {
      "pt": "Nova Sala ...",
      "es": "Nueva sala de...",
      "ru": "Новый номер...",
      "ja": "新しい部屋",
      "zh": "新房间",
      "nl": "nieuwe Kamer",
      "hu": "új szoba"
    },
    "room name": {
      "pt": "nome da sala",
      "es": "sala de nombre",
      "ru": "название комнаты",
      "fr": "nom de la chambre",
      "ja": "ルーム名",
      "de": "Raumnamen",
      "zh": "房间名称",
      "nl": "kamernaam",
      "pl": "nazwa pokój",
      "hu": "szoba neve"
    },
    "Visible (open to everyone)": {
      "pt": "Visível (aberto a todos)",
      "es": "Visible (abierto a todo el mundo)",
      "ru": "Visible (открытый для всех)",
      "fr": "Visible (ouvert à tous)",
      "ja": "目に見える（誰にでも開いている）",
      "de": "Sichtbar (offen für alle)",
      "zh": "可见（向所有人开放）",
      "nl": "Zichtbaar (open voor iedereen)",
      "pl": "Widoczne (otwarte dla wszystkich)",
      "hu": "Látható (nyitott mindenki számára)"
    },
    "Enable Chat": {
      "pt": "Ativar bate-papo",
      "es": "Habilitar chat",
      "ru": "Включить чат",
      "fr": "Activer discuter",
      "ja": "チャットを有効にする",
      "de": "aktivieren Sie chatten",
      "zh": "启用聊天",
      "nl": "Chat inschakelen",
      "pl": "Włącz czat",
      "hu": "a csevegést"
    },
    "Play Alone": {
      "pt": "Jogar Sozinho",
      "es": "Jugar Solo",
      "ru": "Играть в одиночку",
      "fr": "Jouez Seul",
      "ja": "一人でプレイ",
      "de": "Alleine Spielen",
      "zh": "独自玩耍",
      "nl": "Speel Alleen",
      "pl": "Zagraj sam",
      "hu": "Játssz egyedül"
    }
    // todo: it, tr, th, sv, ar, fi, nb, da, sv, he, cs, ko, ro, vi, id, nb, el, sk, bg, lt, sl, hr
    // todo: Connecting, Offline mode, input placeholder, Notifications
  };
  constructor() {
    this.language = this.getLanguage();
  }

  setLanguage(lang: string) {
    this.language = lang;
  }

  getLanguage(): string {
    if (window.navigator && navigator.language && navigator.language.length >= 2) {
      return navigator.language.substr(0, 2).toLowerCase();
    } else {
      return "en";
    }
  }

  get(text: string, lang: string = this.language): string {
    let row = this.strings[text];
    if (row === undefined) return text;
    let string = row[lang];
    if (string === undefined) return text;
    return string;
  }

  perform(lang: string = this.language) {
    let self = this;
    $(".translate").each(function(i: number, ele: HTMLElement) {
      let th = $(this);
      //if (ele.nodeName === "INPUT") {
      if (ele instanceof HTMLInputElement) {
        if (typeof ele.placeholder !== "undefined") {
          th.attr("placeholder", self.get(th.attr("placeholder")!, lang));
        }
      } else {
        th.text(self.get(th.text(), lang));
      }
    });
  }
}