const protocol_maker = require('protocol-maker')
const { setMonth, getMonth,getYear, getDaysInMonth } = require('date-fns')
const calendarMonth = require('month-selector')
const calendarDays = require('day-selector-single')

var id = 0
var count = 0
const sheet = new CSSStyleSheet()
function init_date () {
  const date = new Date()
  let year = getYear(date)
  let month = getMonth(date)
  let days = getDaysInMonth(date)
  return { year, month, days }
}
const { month, days, year } = init_date()
const default_opts = {
	name: 'datepicker',
  pos: month, 
  value: null, 
  year: year, 
  month: { name: `month-selector`, }, 
  days: { name: `day-selector`, count: days },
	theme: get_theme()
}
sheet.replaceSync(default_opts.theme)

module.exports = datepicker

datepicker.help = () => { return { opts: default_opts } }

function datepicker (opts, parent_wire) {
	const { 
		name = default_opts.name,
		value = default_opts.value,
		pos = default_opts.pos,
		year = default_opts.year,
    month = default_opts.month,
    days = default_opts.days,
		theme = '' } = opts

	const current_state =  { opts: { name, value, pos, year, month, days, sheets: [default_opts.theme, theme] } }
  
  // protocol
  const initial_contacts = { 'parent': parent_wire }
  const contacts = protocol_maker('input-number', listen, initial_contacts)
	
  function listen (msg) {
    const { head, refs, type, data, meta } = msg // receive msg
    const [from] = head
    const name = contacts.by_address[from].name
		if (type === 'click') handle_click(name, data)
    if (type === 'clear' && name === 'parent') handle_clear()
    if (type === 'update') { handle_update(data)}
	}
  
  // elements	
  const container = document.createElement('div')
  container.classList.add('calendar-container')
  

  const cal = document.createElement('div')
  cal.classList.add('calendar')

  const weekList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const date = setMonth(new Date(), current_state.opts.pos)
  current_state.opts.days.count = getDaysInMonth(date)
  current_state.opts.year = getYear(date)
  
	const month_name = `month-selector`
	const days_name = `day-selector`
  const cal_month = calendarMonth({ pos: current_state.opts.pos }, contacts.add(month_name))
  let cal_days = calendarDays({
    name: days_name, 
    year: current_state.year,
    month: current_state.opts.pos, 
    days: current_state.days,
    start_cal: true 
  }, contacts.add(days_name))
  
  cal.append(cal_month, makeWeekDays(), cal_days )

  container.append(cal)

  const el = document.createElement('div')
  el.classList.add('datepicker')
  const shadow = el.attachShadow({mode: 'closed'})

  shadow.append(container)

  const custom_theme = new CSSStyleSheet()
	custom_theme.replaceSync(theme)
	shadow.adoptedStyleSheets = [sheet, custom_theme]

  return el 

  // handlers
  function handle_click (name, data) {
    if (name === month_name) {
      const target = data.name
      if (current_state.opts.value) return
      if (target === 'prev') current_state.opts.pos = current_state.opts.pos - 1
      else if (target === 'next') current_state.opts.pos = current_state.opts.pos + 1
      const $cal_month = contacts.by_name[name]
      const $cal_days = contacts.by_name['day-selector']
      $cal_month.notify($cal_month.make({ to: $cal_month.address, type: 'update', data : { pos: current_state.opts.pos } }))
      $cal_days.notify($cal_days.make({ to: $cal_days.address, type: 'update', data: { pos: current_state.opts.pos } }))
    } 
    else if (name === days_name) {
      const $parent = contacts.by_name['parent']
      $parent.notify($parent.make({ to: $parent.address, type: 'click', data }))
    }
  }

  function handle_clear () {
    const $cal_days = contacts.by_name['day-selector']
    $cal_days.notify($cal_days.make({ to: $cal_days.address, type: 'clear' }))
  }

  function handle_update (data) {
		const {  sheets } = data
		if (sheets) {
			const new_sheets = sheets.map(sheet => {
				if (typeof sheet === 'string') {
					current_state.opts.sheets.push(sheet)
					const new_sheet = new CSSStyleSheet()
					new_sheet.replaceSync(sheet)
					return new_sheet
					} 
					if (typeof sheet === 'number') return shadow.adoptedStyleSheets[sheet]
			})
			shadow.adoptedStyleSheets = new_sheets
		}
	}


  
  // helpers

  function makeWeekDays () {
    const el = document.createElement('section')
    el.classList.add('calendar-weekday')
    weekList.map( w => {
      const div = document.createElement('div')
      div.classList.add('calendar-week')
      div.append(w.slice(0 ,1))
      el.append(div)
    })
    return el
  }

	function get_all_cal_days () {
		const keys = Object.keys(contacts.by_name)
		return keys.filter(key => contacts.by_name[key].name.includes('cal-days'))
	}

}

function get_theme () {
  return `
  :host {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    width: 35%;
  }
  .calendar-container {
    display: flex;
    background-color: #F2F2F2;
  }
  .calendar-weekday {
    display: grid;
    grid-template-rows: 30px;
    grid-template-columns: repeat(7, minmax(30px, auto));
    justify-items: center;
    font-size: 12px;
  }
  .calendar-week {
      
  }
  .calendar {
    margin-left: 30px;
    background-color: white;
    margin: 2rem;
  }
  `
}