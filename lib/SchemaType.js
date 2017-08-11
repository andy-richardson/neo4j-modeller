import DatabaseConnection from './DatabaseConnection.js';

const types = {};

export default class SchemaType {
  /* Create new schema type */
  constructor(name, props) {
    this.name = name;
    this.props = {};

    props.forEach((prop)=>{
      this.props[prop.name] = {
        type: prop.type,
        required: prop.required,
        rel: prop.rel
      }
    });

    types[name] = this;
  }

  /* Create object of this type */
  create(props){
    const obj = {type: this.name};

    Object.keys(this.props).forEach((prop) => {
      obj[prop] = props[prop];

      // If not primitive type
      // if(this.props[prop].rel !== undefined){
      //   types[this.props[prop].type].create(props[prop]);
      // }
      //   // Create new instance of type and add relationship
      //   this.props[prop].create = (obj) => types[prop.type].create(obj);
      //
      //   // Fetch existing instance of type and add relationship
      //   this.props[prop].link = (obj) => types[prop.type].link(obj);
      // }
    });

    return obj;
  }

  /* Find object of this type */
  find(props) {
    const constraints = [];

    Object.keys(props).forEach((prop) => {
      // Check property is in schema
      if(this.props[prop] === undefined){
        console.log(`SchemaType Error: No such property "${prop}"`);
        return;
      }

      // Forward to correct parser
      switch (this.props[prop].type) {
        case "int":
          constraints.push(this._matchInt(prop, props[prop]))
          break;

        case "string":
          constraints.push(this._matchString(prop, props[prop]))
          break;

        // rel type
        default:
          break;
      }
    });

    console.log(constraints);

    const db = DatabaseConnection.getConnection();
    let query = `MATCH (a:${this.name}) WHERE `

    constraints.forEach((entry, index) => {
      query += " a." + entry;

      if(index < constraints.length - 1){
        query += " AND ";
      }
    })

    query += ` return a`;
    console.log(query);
    return db.query(query);
  }

  /* Print type information */
  print() {
    console.log("=== Printing schema ===");
    console.log(this);
  }

  /* PRIVATE FUNCTIONS */

  /* Create match statement for String type */
  _matchString(name, str) {
    // Basic equals request
    if(str.substring(1,2) != "|"){
      return `${name} = "${str}"`
    }

    // String operation
    let operation;
    const operator = str.substring(0, 1);
    switch (operator) {
      case "^":
        operation = "STARTS WITH";
        break;

      case ".":
        operation = "CONTAINS";
        break;

      case "/":
        operation = "ENDS WITH";
        break;

      case "~":
        operation = "=~";   // Regular expression
        break;

      default:
        operation = "=";
        break;
    }

    return `${name} ${operation} "${this._expToStr(str)}"`
  }

  /* Create match statement for Int type */
  _matchInt(name, query) {
    if(!isNaN(query)) {
      return `${name} = ${query}`;
    }

    let operation;

    if(query.includes("n")) {
      if(query.includes("!n")){
        operation = "IS NOT NULL"
      } else {
        operation = "IS NULL"
      }

      return `${name} ${operation}`;
    }

    const operator = query.substring(0, 2);
    switch (operator) {
      case ">=":
      case "<=":
        operation = operator;
        break;

      case "!=":
        operation = "<>";
        break;

      default:
        operation = operator[0];
        break;
    }

    return `${name} ${operation} ${this._expToInt(query)}`;
  }

  _expToInt(exp) {
    return exp.match(/\d+/)[0];
  }

  _expToStr(exp) {
    return exp.substring(exp.indexOf("|") + 1);
  }
}
