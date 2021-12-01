const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
const costumers = [];

// Middleware
function verifyIfExistsAccountCpf(request, response, next) {
  const { cpf } = request.headers;

  const costumer = costumers.find((costumer) => costumer.cpf === cpf);

  if (!costumer) {
    return response.status(400).json({ error: "Costumer not found" });
  }

  request.costumer = costumer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return parseInt(acc + operation.amount);
    } else {
      return parseInt(acc - operation.amount);
    }
  }, 0);

  return balance;
}

app.use(express.json());

app.get("/account", verifyIfExistsAccountCpf, (request, response) => {
  const { costumer } = request;
  return response.json(costumer.statement);
});

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const costumerAlreadyExists = costumers.some(
    (costumer) => costumer.cpf === cpf
  );

  if (costumerAlreadyExists) {
    return response.status(400).json({ error: "Costumer already exists!" });
  }

  costumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  app.post("/deposit", verifyIfExistsAccountCpf, (request, response) => {
    const { description, amount } = request.body;
    const { costumer } = request;

    const statementOperation = {
      description,
      amount,
      created_at: new Date(),
      type: "credit",
    };

    costumer.statement.push(statementOperation);

    response.status(201).send();
  });

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCpf, (request, response) => {
  const { amount } = request.body;
  const { costumer } = request;

  const balance = getBalance(costumer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  costumer.statement.push(statementOperation);

  response.status(201).send();
});

app.listen(3333);
