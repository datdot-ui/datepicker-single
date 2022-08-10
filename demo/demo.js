const protocol_maker = require('protocol-maker')
const datepicker = require('..')

var id = 0

module.exports = demo

function demo () {

	const contacts = protocol_maker('demo', listen)
	function listen (msg) {
		const { head, refs, type, data, meta } = msg // receive msg
		const [from] = head
		const name = contacts.by_address[from].name
		if (type === 'click') {
			console.log('New date selected', {data})
		}
	}

	// elements	
	const opts = {}
	const name = `datepicker-${id++}`
  const el = datepicker(opts, contacts.add(name))  
	document.body.onclick = (event) => handle_body_click(event)

  return el

  // handlers

	function handle_body_click (event) {
    const target = event.target.classList.value
    if (target === 'datepicker') return
    clear()
  }

	function clear () {
    const $name = contacts.by_name['datepicker-0']
    $name.notify($name.make({ to: $name.address, type: 'clear' }))
  }
  

}

document.body.append(demo())