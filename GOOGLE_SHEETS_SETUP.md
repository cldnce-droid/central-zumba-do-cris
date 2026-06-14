# Integração com Google Sheets

A integração por Service Account foi descontinuada neste projeto.

Não é mais necessário configurar:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEETS_ID
```

O aplicativo agora utiliza um Google Apps Script Web App como ponte segura com
a planilha.

Consulte [GOOGLE_APPS_SCRIPT_SETUP.md](./GOOGLE_APPS_SCRIPT_SETUP.md) para:

- instalar o código na planilha;
- publicar o Apps Script como Web App;
- configurar `GOOGLE_APPS_SCRIPT_URL`;
- configurar `GOOGLE_APPS_SCRIPT_SECRET`;
- testar cadastro, painel e Área do Aluno.
