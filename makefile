web:
	quarto render
	(cd "../How to Train your Chatbot/src" && quarto render --to html)
	cp -r "../How to Train your Chatbot/src/_book" "docs/chatbots"
