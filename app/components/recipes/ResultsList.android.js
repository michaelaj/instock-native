import React, { Component } from 'react'
import { View, BackHandler, ListView, TouchableHighlight, Text, Dimensions, Image, StyleSheet, ScrollView, Button, RefreshControl, ActivityIndicator } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
// import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import Icon from 'react-native-vector-icons/MaterialIcons'

//the locals
import * as actionCreators from '../../actions'


class ResultsList extends Component {
  constructor(props){
    super(props)

    //determine which dataset to show results for
    let whichData
    if(this.props.persistedSettings.chosenRecipeSearch === 'favData'){
        whichData = this.props.favData 
    } else { whichData = this.props.recipes  }
      

    const ds = new ListView.DataSource({rowHasChanged: (r1,r2) => r1 !== r2})
    this.subscription
    this.state = {  
      searching: false,
      whichData: whichData,
      dataSource: ds.cloneWithRows(whichData)
    }//state
  }//constructor

  static navigationOptions = {
    title: 'Results',
    header: null,
  }//nav options

  //Life Cycle Methods
  componentWillMount() {
    // console.log('ResultsList will mount')
    this.subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // console.log('back button pressed')
      // console.log('the state is: ' + this.props.navigation.state.routeName +  ' ' + this.props.navigation.state.key)
      this.props.navigation.goBack()
      return true
    })
  }//will mount

  componentWillUnmount() {
    // console.log('ResultsList will UNmount')
    this.subscription.remove()
  }// will unmount

  handlePress(item){
    if(this.props.persistedSettings.chosenRecipeSearch === 'queryRecipesData'){
      this.setState({ searching: true })

      //fethc and then...
      this.props.getSingleRecipe(item.id).then(() => {
        // console.log('updating the single recipe details')
        this.props.updateDetailRecipe(this.props.singleRecipeData[0].id, this.props.singleRecipeData[0].title, this.props.singleRecipeData[0].readyInMinutes, this.props.singleRecipeData[0].image, this.props.singleRecipeData[0].extendedIngredients, this.props.singleRecipeData[0].analyzedInstructions)
        this.setState({ searching: false })
        this.props.navigation.dispatch({ type: 'Details' })
      })
    } else {
      //dispatch action
      this.props.updateDetailRecipe(item.id, item.title, item.readyInMinutes, item.image, item.extendedIngredients, item.analyzedInstructions)

      //navigate
      this.props.navigation.dispatch({ type: 'Details' })
    }//else
  }//handlePress

  handleSearchedFlag(){
    this.props.updateSearchedFlag(
      this.props.persistedSettings.chosenRecipeSearch === 'breakfastData' ? true : this.props.persistedSettings.newSearchBreakfast, 
      this.props.persistedSettings.chosenRecipeSearch === 'lunchData' ? true : this.props.persistedSettings.newSearchLunch,
      this.props.persistedSettings.chosenRecipeSearch === 'dinnerData' ? true : this.props.persistedSettings.newSearchDinner, 
      this.props.persistedSettings.chosenRecipeSearch === 'dessertData' ? true : this.props.persistedSettings.newSearchDessert,
    )
    // console.log('end of list reached...')
  }//handleSearchedFlag

  onRefresh(){
    let category
    let whichData = this.props.recipes
    let theSearch = this.props.persistedSettings.chosenRecipeSearch

    if(
        theSearch === 'breakfastData' || 
        theSearch === 'lunchData' ||
        theSearch === 'dinnerData' ||
        theSearch === 'dessertData'
      ){
      //set the category
      if(theSearch === 'breakfastData'){ category = 'breakfast'}
      else if(theSearch === 'lunchData'){ category = 'lunch'}
      else if(theSearch === 'dinnerData'){ category = 'dinner'}
      else{ category = 'dessert'}
      
      this.setState({ searching: true })
      this.props.getRecipes(category)
        .then(() => {
            let updatedData
            if(theSearch === 'favData'){
                updatedData = this.props.favData
              } else { updatedData = this.props.recipes  }

            this.setState({ dataSource: this.state.dataSource.cloneWithRows(updatedData) })
            this.setState({ searching: false })
        })
    }//end if
  }//onRefresh

  render() {
    const { width } = Dimensions.get('screen')
    let resultHeader
    if(this.props.persistedSettings.chosenRecipeSearch === 'dinnerData'){
      resultHeader = 'Dinner'
    } else if(this.props.persistedSettings.chosenRecipeSearch === 'dessertData'){
      resultHeader = 'Dessert'
    } else if(this.props.persistedSettings.chosenRecipeSearch === 'lunchData'){
      resultHeader = 'Lunch'
    } else if(this.props.persistedSettings.chosenRecipeSearch === 'favData'){
      resultHeader = 'Favorites'
    } else if(this.props.persistedSettings.chosenRecipeSearch === 'breakfastData'){
      resultHeader = 'Breakfast'
    } else if(this.props.persistedSettings.chosenRecipeSearch === 'queryRecipesData'){
      resultHeader = 'Results'
    } else {
      resultHeader = "InStock"
    }


    if(this.state.searching){
      return <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', backgroundColor: '#fff' }} ><ActivityIndicator animating={this.state.searching} color='#b2dfdb' size='large' /></View>
    } else if(this.props.persistedSettings.chosenRecipeSearch === 'favData' && this.props.favData.length === 0){ 
        return <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', padding: 15 }} ><Text style={{ color: '#999', fontSize: 20}} >hmmmm...looks like no favorites added yet</Text></View> 
    } else if(this.state.whichData.length === 0){
        return <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', padding: 15 }} ><Text style={{ color: '#999', fontSize: 20}} >not many things you can make with those ingredients...</Text></View> 
    } else{
      return (
        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', backgroundColor: '#fff', width: width }} >


          <View style={styles.headerBar}>
            <TouchableHighlight onPress={() => this.props.navigation.goBack()}  style={ styles.dateBarLeft }   activeOpacity={0.3} underlayColor='#efebe9'>
              <Icon name='arrow-back' size={28} color='#616161' />
            </TouchableHighlight>
            <Text style={ styles.dateBarTitle }>{resultHeader}</Text>
          </View>

          <ListView 
            dataSource={this.state.dataSource}
            renderRow={(item) => 
                <TouchableHighlight onPress={() => this.handlePress(item) } style={{width: width, height: 400, flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginBottom: 5}} >
                  <View style={{ width: width, flex: 1, alignItems: 'center', justifyContent: 'flex-start' }} >
                    <Image opacity={1} source={{uri: this.props.persistedSettings.chosenRecipeSearch === 'queryRecipesData' ? "https://spoonacular.com/recipeImages/" + item.image : item.image}} style={{width: width, flex: 1}} />
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.7)' ,position:'absolute', width: width, height: 75,marginTop: 15, justifyContent: 'center', alignItems: 'flex-start' }}>
                      <Text ellipsizeMode='tail' numberOfLines={2} style={{ color: '#fff', fontSize: 25, marginLeft: 15, paddingBottom: 3 }} >{item.title}</Text>
                    </View>
                    <View style={{ alignItems:'center', justifyContent:'center', height: 60, position:'absolute', marginTop: 300, right: 50 }} >
                      <Icon name='favorite' size={60} color={this.props.favData.findIndex((favItem) => favItem.id === item.id) === -1 ? 'rgba(0,0,0,0)' : '#c62828'} />
                    </View>
                  </View>
                </TouchableHighlight>
            }
            initialListSize={5}
            pageSize={10}
            enableEmptySections={true}
            onEndReached={() => this.handleSearchedFlag()}
            refreshControl={
              <RefreshControl 
                refreshing={this.state.searching}
                onRefresh={this.onRefresh.bind(this)}
                colors={['#00897b']}
                enabled={true}
                progressBackgroundColor='#fff'
              />
            }
            />
        </View>
      )//return
    }//end if-else
  }//render
}//component

const mapStateToProps = state => ({
  recipes: state.recipes,
  singleRecipeData: state.singleRecipeData,
  chosenDetailItem: state.chosenDetailItem,
  persistedSettings: state.persistedSettings,
  favData: state.favData,
})//map state to props

function mapDispatchToProps(dispatch){
  return bindActionCreators(actionCreators, dispatch)
}//map dispatch to props

const { width } = Dimensions.get('screen')
const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 40,
    paddingLeft: 20,
    width: width,
    backgroundColor: '#F5F5F5',
  },
  dateBarTitle: {
    fontSize: 25, 
    color: '#616161'
  },
  dateBarLeft: {width: 0.2*(width-20), marginRight: 0.1*(width-20)},
})


export default connect(mapStateToProps, mapDispatchToProps)(ResultsList)