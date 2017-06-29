import re

def format_name(input_name):
  """ Given Last, First or First Last with any spacing and any capitalization,
  return First Last  or an error """
  names = input_name.strip()
  m = re.match(r'([\w,]+)\s+([\w]+)', names)
  if m:
    last = None
    first = None
    name1, name2 = m.group(1, 2)
    if name1[-1] == ',':
      last = name1[:-1]
      first = name2
    else:
      first = name1
      last = name2
    if re.match(r'Mc[A-Z]', first) or re.match(r'Mc[A-Z]', last):
      return ' '.join([first, last])
    else:
      first = first.lower()
      last = last.lower()
      return ' '.join([first, last]).title()


def test_validate_names():
  correct_name = 'First Last'
  input_names = ['Last, First', 'First Last', 'first last', ' LAST,    first ',
  ' last, first ', 'LAST, FIRST']
  for name in input_names:
    assert format_name(name) == correct_name
  incorrect_names = ['Last, ', ' First ', ' , ', ' ']
  for name in incorrect_names:
    assert format_name(name) is None
  correct_mc = 'First McLast'
  mc_names = ['McLast, First', 'First McLast']
  for name in mc_names:
    assert format_name(name) == correct_mc
  print('Success')

if __name__ == '__main__':
  test_validate_names()
