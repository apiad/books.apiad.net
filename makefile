web:
	quarto render
	(cd "../How to Train your Chatbot/src" && quarto render --to html)
	cp -r "../How to Train your Chatbot/src/_book" "docs/chatbots"
	(cd "../The Science of Computation/src" && quarto render --to html)
	cp -r "../The Science of Computation/src/_book" "docs/tsoc"
	(cd "../Mostly Harmless AI" && quarto render --to html)
	cp -r "../Mostly Harmless AI/_book" "docs/mhai"
