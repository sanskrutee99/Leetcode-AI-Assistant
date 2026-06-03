function getProblemContext() {
  const title =
    document.querySelector("div[data-cy='question-title']")?.innerText?.trim() ||
    "";
  const description =
    document
      .querySelector("div[data-track-load='description_content']")
      ?.innerText?.trim() || "";
  return { title, description };
}
