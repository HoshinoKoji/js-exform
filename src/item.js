class Item {
  static get TYPES() {
    return ["text", "radio", "checkbox", "scale"];
  }

  constructor({type, title, optTexts, optValues = null}) {
    this._title = title;
    this._type = type;
    this._texts = optTexts;
    this._values = optValues;
    this._response = null;
  }

  static isValid({type, title, optTexts, optValues = null}) {
    if (!title || !Item.TYPES.includes(type)) {
      return false;
    }
    if (type === "text") {
      return true;
    }
    if (optTexts && optValues && optTexts.length !== optValues.length) {
      return false;
    }
    return true;
  }
}

export default Item;