import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString
} from 'graphql'
import { AuthentificationError, DatabaseError, WrongArgumentsError } from '../../errors'
import { EventType } from '../types'
import { Event } from '../../models'

const args = {
  eventDesignator: { type: new GraphQLNonNull(GraphQLID) },
  title: { type: new GraphQLNonNull(GraphQLString) },
  newtitle: { type: GraphQLString },
  description: { type: GraphQLString }
}

const resolve = (parent, { eventDesignator, title, newtitle, description }, context) => {
  const hostId = context.userId
  if (!hostId) {
    throw new AuthentificationError()
  }
  return new Promise((resolve, reject) => {
    Event.findOne({ designator: eventDesignator, hostId }).exec((err, event) => {
      if (err) {
        reject(err)
      } else if (!event) {
        reject(new DatabaseError('None of the events you own respond to that designator'))
      } else {
        let ruleIndex = null
        event.rules.find((rule, index) => {
          if (rule.title === title) {
            ruleIndex = index
          }
        })
        if (!ruleIndex) {
          reject(new DatabaseError('There is no rule with that title'))
          return
        }
        event.rules[ruleIndex].description = description || event.rules[ruleIndex].description
        if (event.rules.some(rule => rule.title === newtitle)) {
          reject(new WrongArgumentsError('There is already a rule using your new title'))
        } else {
          event.rules[ruleIndex].title = newtitle || event.rules[ruleIndex].title
        }

        event.save((err) => {
          if (err) reject(err)
          else {
            resolve(event)
          }
        })
      }
    })
  })
}

const mutation = {
  editRule: {
    type: EventType,
    args,
    resolve
  }
}

export default mutation